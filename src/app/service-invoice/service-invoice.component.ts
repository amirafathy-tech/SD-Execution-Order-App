import { Component } from '@angular/core';
import { ExecutionOrderService } from '../execution-order/execution-order.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import * as FileSaver from 'file-saver';
import { MainItem, SubItem } from '../execution-order/execution-order.model';
import { LineType } from '../models/lineType.model';
import { MaterialGroup } from '../models/materialGroup.model';
import { ServiceMaster } from '../models/service-master.model';
import { ServiceType } from '../models/serviceType.model';
import { UnitOfMeasure } from '../models/unitOfMeasure.model';
import { ApiService } from '../shared/ApiService.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-service-invoice',
  templateUrl: './service-invoice.component.html',
  styleUrls: ['./service-invoice.component.css'],
  
  providers: [MessageService, ExecutionOrderService, ConfirmationService]
})
export class ServiceInvoiceComponent {


  serviceInvoiceMainItem : MainItem []= []

  record!: MainItem;

    lineNumber:string=""
  
    searchKey: string = ""
    currency: any
    totalValue: number = 0.0
    //fields for dropdown lists
    recordsServiceNumber!: ServiceMaster[];
    selectedServiceNumberRecord?: ServiceMaster
    selectedServiceNumber!: number;
    updateSelectedServiceNumber!: number
    updateSelectedServiceNumberRecord?: ServiceMaster
    shortText: string = '';
    updateShortText: string = '';
    shortTextChangeAllowed: boolean = false;
    updateShortTextChangeAllowed: boolean = false;
  
  
  
    recordsUnitOfMeasure: UnitOfMeasure[] = [];
    selectedUnitOfMeasure!: string;
  
    recordsMaterialGroup: MaterialGroup[] = [];
    selectedMaterialGroup!: string;
  
    recordsServiceType: ServiceType[] = [];
    selectedServiceType!: string;
  
  
    recordsLineType: LineType[] = [];
    selectedLineType!: string;
  
    recordsCurrency!: any[];
    selectedCurrency!: string;
    //
   
  
    public rowIndex = 0;
    expandedRows: { [key: number]: boolean } = {};
  
    mainItemsRecords: MainItem[] = [];
    subItemsRecords: SubItem[] = [];
  
  
  
    constructor(private _ApiService: ApiService,private router: Router, private _ExecutionOrderService: ExecutionOrderService, private messageService: MessageService, private confirmationService: ConfirmationService) { 
console.log(this.router.getCurrentNavigation()?.extras.state?.['Record']);

      //let record = MainItem;
      this.record = this.router.getCurrentNavigation()?.extras.state?.['Record']
      if(this.record){
      this.serviceInvoiceMainItem.push(this.record);
      console.log(this.serviceInvoiceMainItem);
      }
      
      // if (this.serviceInvoiceMainItem) {
      //   this.modelSpecDetailsCodes = this.modelSpecRecord.modelSpecDetailsCode
      // }
      // else {
      //  // this.serviceInvoiceMainItem = undefined
      // }
    }
  
  
  searchLineNumber(lineNumber:string){
    console.log(lineNumber);
    
  }
  
    ngOnInit() {
      console.log("lineNumber",this.lineNumber);
      //1- get record by lineNumber from DB
      //2- save that retrieved record in a variable object
      //3- combine object fields to html in footer
      
  
      this._ApiService.get<ServiceMaster[]>('servicenumbers').subscribe(response => {
        this.recordsServiceNumber = response
        //.filter(record => record.deletionIndicator === false);
      });
  
      this._ApiService.get<MaterialGroup[]>('materialgroups').subscribe(response => {
        this.recordsMaterialGroup = response
      });
      this._ApiService.get<ServiceType[]>('servicetypes').subscribe(response => {
        this.recordsServiceType = response
      });
      this._ApiService.get<LineType[]>('linetypes').subscribe(response => {
        this.recordsLineType = response
      });
  
      this._ApiService.get<any[]>('currencies').subscribe(response => {
        this.recordsCurrency = response;
      });
      this._ApiService.get<MainItem[]>('executionordermain').subscribe(response => {
        this.mainItemsRecords = response.sort((a, b) => b.executionOrderMainCode - a.executionOrderMainCode);
        console.log(this.mainItemsRecords);
  
        const filteredRecords = this.mainItemsRecords.filter(record => record.lineTypeCode != "");
  
        this.totalValue = this.mainItemsRecords.reduce((sum, record) => sum + record.total, 0);
        console.log('Total Value:', this.totalValue);
      });
      
    }
    // Helper Functions:
    removePropertiesFrom(obj: any, propertiesToRemove: string[]): any {
      const newObj: any = {};
  
      for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
          if (Array.isArray(obj[key])) {
            // If the property is an array, recursively remove properties from each element
            newObj[key] = obj[key].map((item: any) => this.removeProperties(item, propertiesToRemove));
          } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            // If the property is an object, recursively remove properties from the object
            newObj[key] = this.removeProperties(obj[key], propertiesToRemove);
          } else if (!propertiesToRemove.includes(key)) {
            // Otherwise, copy the property if it's not in the list to remove
            newObj[key] = obj[key];
          }
        }
      }
  
      return newObj;
    }
    removeProperties(obj: any, propertiesToRemove: string[]): any {
      const newObj: any = {};
      Object.keys(obj).forEach(key => {
        if (!propertiesToRemove.includes(key)) {
          newObj[key] = obj[key];
        }
      });
      return newObj;
    }
    // to handel checkbox selection:
    selectedMainItems: MainItem[] = [];
    selectedSubItems: SubItem[] = [];
    onMainItemSelection(event: any, mainItem: MainItem) {
      mainItem.selected = event.checked;
      console.log(event.checked);
  
  
      // this.selectedMainItems = event.checked
      console.log(this.selectedMainItems);
  
      if (mainItem.selected) {
        this.selectedMainItems.push(mainItem);
        console.log(this.selectedMainItems);
  
  
        if (mainItem.executionOrdersubList && mainItem.executionOrdersubList.length > 0) {
          mainItem.executionOrdersubList.forEach(subItem => subItem.selected = !subItem.selected);
        }
      }
      else {
        const index = this.selectedMainItems.indexOf(mainItem);
        console.log(index);
        
        if (index !== -1) {
          this.selectedMainItems.splice(index, 1);
          console.log(this.selectedMainItems);
        }
        // User deselected the record, so we need to deselect all associated subitems
        if (mainItem.executionOrdersubList && mainItem.executionOrdersubList.length > 0) {
          mainItem.executionOrdersubList.forEach(subItem => subItem.selected = false)
          console.log(mainItem.executionOrdersubList);
        }
      }
    }
    // to handle All Records Selection / Deselection 
    selectedAllRecords: MainItem[] = [];
    onSelectAllRecords(event: any): void {
      if (Array.isArray(event.checked) && event.checked.length > 0) {
        this.selectedAllRecords = [...this.mainItemsRecords];
        console.log(this.selectedAllRecords);
      } else {
        this.selectedAllRecords = [];
      }
    }
  
    onSubItemSelection(event: any, subItem: SubItem) {
      console.log(subItem);
      this.selectedSubItems.push(subItem);
    }
    //In Creation to handle shortTextChangeAlowlled Flag 
    onServiceNumberChange(event: any) {
      const selectedRecord = this.recordsServiceNumber.find(record => record.serviceNumberCode === this.selectedServiceNumber);
      if (selectedRecord) {
        this.selectedServiceNumberRecord = selectedRecord
        this.shortTextChangeAllowed = this.selectedServiceNumberRecord?.shortTextChangeAllowed || false;
        this.shortText = ""
      }
      else {
        console.log("no service number");
        //this.dontSelectServiceNumber = false
        this.selectedServiceNumberRecord = undefined;
      }
    }
    //In Update to handle shortTextChangeAlowlled Flag 
    onServiceNumberUpdateChange(event: any) {
      const updateSelectedRecord = this.recordsServiceNumber.find(record => record.serviceNumberCode === event.value);
      if (updateSelectedRecord) {
        this.updateSelectedServiceNumberRecord = updateSelectedRecord
        this.updateShortTextChangeAllowed = this.updateSelectedServiceNumberRecord?.shortTextChangeAllowed || false;
        this.updateShortText = ""
      }
      else {
        this.updateSelectedServiceNumberRecord = undefined;
      }
    }
  
    expandAll() {
      this.mainItemsRecords.forEach(item => this.expandedRows[item.executionOrderMainCode] = true);
    }
    collapseAll() {
      this.expandedRows = {};
    }
  
    // For Edit  MainItem
    clonedMainItem: { [s: number]: MainItem } = {};
    onMainItemEditInit(record: MainItem) {
      this.clonedMainItem[record.executionOrderMainCode] = { ...record };
    }
    onMainItemEditSave(index: number, record: MainItem) {
      console.log(record);
  
      const { executionOrderMainCode, total, ...mainItemWithoutMainItemCode } = record;
      const updatedMainItem = this.removePropertiesFrom(mainItemWithoutMainItemCode, ['executionOrderMainCode', 'executionOrderSubCode']);
      console.log(updatedMainItem);
  
      console.log(this.updateSelectedServiceNumber);
      if (this.updateSelectedServiceNumberRecord) {
        // (record?.subItems ?? []).map(subItem =>
        //   this.removeProperties(subItem, ['mainItemCode', 'subItemCode'])
        // )
        const newRecord: MainItem = {
          ...record, // Copy all properties from the original record
          // Modify specific attributes
          executionOrdersubList: (record?.executionOrdersubList ?? []).map(subItem =>
            this.removeProperties(subItem, ['executionOrderMainCode', 'executionOrderSubCode'])
          ),
          unitOfMeasurementCode: this.updateSelectedServiceNumberRecord.baseUnitOfMeasurement,
          description: this.updateSelectedServiceNumberRecord.description,
          materialGroupCode: this.updateSelectedServiceNumberRecord.materialGroupCode,
          serviceTypeCode: this.updateSelectedServiceNumberRecord.serviceTypeCode,
        };
        console.log(newRecord);
        this._ApiService.patch<MainItem>('executionordermain', record.executionOrderMainCode, newRecord).subscribe(response => {
          console.log('executionordermain updated:', response);
          if (response) {
            this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Record is updated' });
          }
          else {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Invalid Data' });
          }
          // console.log(this.totalValue)
          this.totalValue = 0;
          this.ngOnInit()
        });
      }
  
      if (!this.updateSelectedServiceNumberRecord) {
        console.log({ ...mainItemWithoutMainItemCode });
        this._ApiService.patch<MainItem>('executionordermain', record.executionOrderMainCode, { ...updatedMainItem }).subscribe(response => {
          console.log('executionordermain updated:', response);
          if (response) {
            this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Record is updated' });
          }
          else {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Invalid Data' });
          }
          this.totalValue = 0;
          //this.modelSpecDetailsService.getRecords();
          this.ngOnInit()
        });
      }
    }
    onMainItemEditCancel(row: MainItem, index: number) {
      this.mainItemsRecords[index] = this.clonedMainItem[row.executionOrderMainCode]
      delete this.clonedMainItem[row.executionOrderMainCode]
    }
  
    // For Edit  SubItem
    clonedSubItem: { [s: number]: SubItem } = {};
    onSubItemEditInit(record: SubItem) {
      if (record.executionOrderSubCode) {
        this.clonedSubItem[record.executionOrderSubCode] = { ...record };
      }
    }
    onSubItemEditSave(index: number, record: SubItem) {
      console.log(record);
      console.log(index);
  
  
      const { executionOrderSubCode, ...subItemWithoutSubItemCode } = record;
  
      console.log(this.updateSelectedServiceNumber);
      if (this.updateSelectedServiceNumberRecord) {
        const newRecord: SubItem = {
          ...record, // Copy all properties from the original record
          // Modify specific attributes
          unitOfMeasurementCode: this.updateSelectedServiceNumberRecord.baseUnitOfMeasurement,
          description: this.updateSelectedServiceNumberRecord.description,
          materialGroupCode: this.updateSelectedServiceNumberRecord.materialGroupCode,
          serviceTypeCode: this.updateSelectedServiceNumberRecord.serviceTypeCode,
        };
        console.log(newRecord);
        this._ApiService.patch<SubItem>('executionordersub', index, newRecord).subscribe(response => {
          console.log('executionordersub updated:', response);
          if (response) {
            this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Record is updated' });
          }
          else {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Invalid Data' });
          }
          // console.log(this.totalValue)
          // this.totalValue = 0;
          this.ngOnInit()
        });
      }
  
  
      if (!this.updateSelectedServiceNumberRecord) {
        this._ApiService.patch<SubItem>('executionordersub', index, { ...subItemWithoutSubItemCode }).subscribe(response => {
          console.log('executionordersub updated:', response);
          if (response) {
            this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Record is updated' });
          }
          else {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Invalid Data' });
          }
          //this.totalValue = 0;
          //this.modelSpecDetailsService.getRecords();
          this.ngOnInit()
        });
      }
    }
    onSubItemEditCancel(row: SubItem, index: number) {
      this.subItemsRecords[index] = this.clonedSubItem[row.executionOrderSubCode ? row.executionOrderSubCode : 0]
      delete this.clonedSubItem[row.executionOrderSubCode ? row.executionOrderSubCode : 0]
    }
  
    // Delete MainItem || SubItem
    deleteRecord() {
      console.log("delete");
      if (this.selectedMainItems.length) {
        this.confirmationService.confirm({
          message: 'Are you sure you want to delete the selected record?',
          header: 'Confirm',
          icon: 'pi pi-exclamation-triangle',
          accept: () => {
            for (const record of this.selectedMainItems) {
              console.log(record);
              // const updatedRecord: ModelSpecDetails = {
              //   ...record, // Copy all properties from the original record
              //   deletionIndicator: true
              // }
              this._ApiService.delete<MainItem>('executionordermain', record.executionOrderMainCode).subscribe(response => {
                console.log('executionordermain deleted :', response);
                this.totalValue = 0;
                this.ngOnInit();
              });
            }
            this.messageService.add({ severity: 'success', summary: 'Successfully', detail: 'Deleted', life: 3000 });
            this.selectedMainItems = []; // Clear the selectedRecords array after deleting all records
          }
        });
      }
      if (this.selectedSubItems.length) {
        this.confirmationService.confirm({
          message: 'Are you sure you want to delete the selected record?',
          header: 'Confirm',
          icon: 'pi pi-exclamation-triangle',
          accept: () => {
            for (const record of this.selectedSubItems) {
              console.log(record);
              // const updatedRecord: ModelSpecDetails = {
              //   ...record, // Copy all properties from the original record
              //   deletionIndicator: true
              // }
              if (record.executionOrderSubCode) {
                this._ApiService.delete<SubItem>('executionordersub', record.executionOrderSubCode).subscribe(response => {
                  console.log('executionordersub deleted :', response);
                  //this.totalValue = 0;
                  this.ngOnInit();
                });
              }
  
            }
            this.messageService.add({ severity: 'success', summary: 'Successfully', detail: 'Deleted', life: 3000 });
            this.selectedSubItems = []; // Clear the selectedRecords array after deleting all records
          }
        });
      }
    }
  
    // For Add new  Main Item
    newMainItem: MainItem = {
      executionOrderMainCode: 0,
      serviceNumberCode: 0,
      description: "",
      unitOfMeasurementCode: "",
      currencyCode: "",
      materialGroupCode: "",
      serviceTypeCode: "",
      personnelNumberCode: "",
      lineTypeCode: "",

      totalQuantity: 0,
      amountPerUnit: 0,
      total: 0,
      actualQuantity: 0,
      actualPercentage: 0,
      overFulfillmentPercentage: 0,
      unlimitedOverFulfillment: false,
      manualPriceEntryAllowed: false,
      externalServiceNumber: "",
      serviceText: "",
      lineText: "",
      lineNumber: "",

      biddersLine: false,
      supplementaryLine: false,
      lotCostOne: false,
      doNotPrint: false,
      Type: ''
    };
  
    addMainItem() {
      if (!this.selectedServiceNumberRecord) { // if user didn't select serviceNumber 
  
        const newRecord = {
          unitOfMeasurementCode: this.selectedUnitOfMeasure,
          currencyCode: this.selectedCurrency,
          description: this.newMainItem.description,
  
          materialGroupCode: this.selectedMaterialGroup,
          serviceTypeCode: this.selectedServiceType,
          // lesa .....
          personnelNumberCode: this.newMainItem.personnelNumberCode,
          lineTypeCode: this.selectedLineType,
  
          totalQuantity: this.newMainItem.totalQuantity,
          amountPerUnit: this.newMainItem.amountPerUnit,
          total: this.newMainItem.total,
          actualQuantity: this.newMainItem.actualQuantity,
          actualPercentage: this.newMainItem.actualPercentage,
  
          overFulfillmentPercentage: this.newMainItem.overFulfillmentPercentage,
          unlimitedOverFulfillment: this.newMainItem.unlimitedOverFulfillment,
          manualPriceEntryAllowed: this.newMainItem.manualPriceEntryAllowed,
          externalServiceNumber: this.newMainItem.externalServiceNumber,
          serviceText: this.newMainItem.serviceText,
          lineText: this.newMainItem.lineText,
          lineNumber: this.newMainItem.lineNumber,
  
          biddersLine: this.newMainItem.biddersLine,
          supplementaryLine: this.newMainItem.supplementaryLine,
          lotCostOne: this.newMainItem.lotCostOne,
          doNotPrint: this.newMainItem.doNotPrint,
        }
        if (this.newMainItem.totalQuantity === 0 || this.newMainItem.description === "" || this.selectedCurrency === "") {
          // || this.newMainItem.unitOfMeasurementCode === ""  // till retrieved from cloud correctly
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Description & Quantity & Currency and UnitOfMeasurement are required',
            life: 3000
          });
        }
        else {
          console.log(newRecord);
          // Remove properties with empty or default values
          const filteredRecord = Object.fromEntries(
            Object.entries(newRecord).filter(([_, value]) => {
              return value !== '' && value !== 0 && value !== undefined && value !== null;
            })
          );
          console.log(filteredRecord);
          this._ApiService.post<MainItem>('executionordermain', filteredRecord).subscribe({
            next: (res) => {
              console.log('executionordermain created:', res);
              this.ngOnInit()
            }, error: (err) => {
              console.log(err);
            },
            complete: () => {
              this.resetNewMainItem();
              this.selectedUnitOfMeasure = "";
              this.selectedCurrency = "";
              this.selectedMaterialGroup = "";
              this.selectedServiceType = "";
              this.selectedLineType = "";
  
              this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Record added successfully ' });
              // this.ngOnInit()
            }
          });
          // this._ApiService.post<MainItem>('executionordermain', filteredRecord).subscribe((response: MainItem) => {
          //   console.log('executionordermain created:', response);
          //   if (response) {
          //     this.resetNewMainItem();
          //   }
          //   console.log(response);
          //   this.totalValue = 0;
          //   this.ngOnInit()
          // });
        }
      }
  
      else if (this.selectedServiceNumberRecord) { // if user select serviceNumber 
        const newRecord = {
          serviceNumberCode: this.selectedServiceNumber,
          unitOfMeasurementCode: this.selectedServiceNumberRecord?.baseUnitOfMeasurement,
          currencyCode: this.selectedCurrency,
  
          description: this.selectedServiceNumberRecord?.description,
          // lesa .....
          materialGroupCode: this.selectedServiceNumberRecord?.materialGroupCode,
          serviceTypeCode: this.selectedServiceNumberRecord?.serviceTypeCode,
          personnelNumberCode: this.newMainItem.personnelNumberCode,
          lineTypeCode: this.selectedLineType,
  
          totalQuantity: this.newMainItem.totalQuantity,
          amountPerUnit: this.newMainItem.amountPerUnit,
          total: this.newMainItem.total,
          actualQuantity: this.newMainItem.actualQuantity,
          actualPercentage: this.newMainItem.actualPercentage,
  
          overFulfillmentPercentage: this.newMainItem.overFulfillmentPercentage,
          unlimitedOverFulfillment: this.newMainItem.unlimitedOverFulfillment,
          manualPriceEntryAllowed: this.newMainItem.manualPriceEntryAllowed,
          externalServiceNumber: this.newMainItem.externalServiceNumber,
          serviceText: this.newMainItem.serviceText,
          lineText: this.newMainItem.lineText,
          lineNumber: this.newMainItem.lineNumber,
  
          biddersLine: this.newMainItem.biddersLine,
          supplementaryLine: this.newMainItem.supplementaryLine,
          lotCostOne: this.newMainItem.lotCostOne,
          doNotPrint: this.newMainItem.doNotPrint,
        }
        if (this.newMainItem.totalQuantity === 0 || this.selectedServiceNumberRecord.description === "" || this.selectedCurrency === "") {
          // || this.newMainItem.unitOfMeasurementCode === ""  // till retrieved from cloud correctly
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Description & Quantity & Currency and UnitOfMeasurement are required',
            life: 3000
          });
        }
        else {
          console.log(newRecord);
          // Remove properties with empty or default values
          const filteredRecord = Object.fromEntries(
            Object.entries(newRecord).filter(([_, value]) => {
              return value !== '' && value !== 0 && value !== undefined && value !== null;
            })
          );
          console.log(filteredRecord);
          this._ApiService.post<MainItem>('executionordermain', filteredRecord).subscribe({
            next: (res) => {
              console.log('executionordermain created:', res);
              this.ngOnInit()
            }, error: (err) => {
              console.log(err);
            },
            complete: () => {
              this.resetNewMainItem();
              this.selectedServiceNumberRecord = undefined;
              //this.selectedServiceNumber = 0;
              this.selectedLineType = "";
              this.selectedCurrency = ""
              this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Record added successfully ' });
              //this.ngOnInit()
            }
          });
  
          // this._ApiService.post<MainItem>('executionordermain', filteredRecord).subscribe((response: MainItem) => {
          //   console.log('executionordermain created:', response);
          //   if (response) {
          //     this.resetNewMainItem();
          //     this.selectedServiceNumberRecord = undefined;
          //     this.selectedServiceNumber = 0;
          //     this.selectedLineType = "";
          //     this.selectedCurrency = ""
          //   }
          //   console.log(response);
          //   this.totalValue = 0;
          //   this.ngOnInit()
          // });
        }
      }
    }
  
    resetNewMainItem() {
      this.newMainItem = {
        executionOrderMainCode: 0,
        serviceNumberCode: 0,
        description: "",
        unitOfMeasurementCode: "",
        currencyCode: "",
        materialGroupCode: "",
        serviceTypeCode: "",
        personnelNumberCode: "",
        lineTypeCode: "",
  
        totalQuantity: 0,
        amountPerUnit: 0,
        total: 0,
        actualQuantity: 0,
        actualPercentage: 0,
        overFulfillmentPercentage: 0,
        unlimitedOverFulfillment: false,
        manualPriceEntryAllowed: false,
        externalServiceNumber: "",
        serviceText: "",
        lineText: "",
        lineNumber: "",
  
        biddersLine: false,
        supplementaryLine: false,
        lotCostOne: false,
        doNotPrint: false,
        Type:''
  
        // subItems?:SubItem[]
      },
        this.selectedUnitOfMeasure = '';
      // this.selectedServiceNumber=0
    }
  
  
  
  
  
    // For Add new  Sub Item
    newSubItem: SubItem = {
      executionOrderSubCode: 0,
      serviceNumberCode: 0,
      description: "",
      unitOfMeasurementCode: "",
      currencyCode: "",
      materialGroupCode: "",
      serviceTypeCode: "",
      personnelNumberCode: "",
      lineTypeCode: "",
  
      totalQuantity: 0,
      amountPerUnit: 0,
      total: 0,
  
      externalServiceNumber: "",
      serviceText: "",
      lineText: "",
      lineNumber: "",
  
      biddersLine: false,
      supplementaryLine: false,
      lotCostOne: false,
      doNotPrint: false,

      Type:''
  
    };
  
    addSubItem(mainItem: MainItem) {
      console.log(mainItem);
      if (!this.selectedServiceNumberRecord) { // if user didn't select serviceNumber
  
        const newRecord = {
          unitOfMeasurementCode: this.selectedUnitOfMeasure,
          currencyCode: this.selectedCurrency,
          description: this.newSubItem.description,
  
          materialGroupCode: this.selectedMaterialGroup,
          serviceTypeCode: this.selectedServiceType,
          personnelNumberCode: this.newSubItem.personnelNumberCode,
          lineTypeCode: this.selectedLineType,
  
          totalQuantity: this.newSubItem.totalQuantity,
          amountPerUnit: this.newSubItem.amountPerUnit,
         // total: this.newSubItem.total,
  
          externalServiceNumber: this.newSubItem.externalServiceNumber,
          serviceText: this.newSubItem.serviceText,
          lineText: this.newSubItem.lineText,
          lineNumber: this.newSubItem.lineNumber,
  
          biddersLine: this.newSubItem.biddersLine,
          supplementaryLine: this.newSubItem.supplementaryLine,
          lotCostOne: this.newSubItem.lotCostOne,
          doNotPrint: this.newSubItem.doNotPrint,
        }
        console.log(newRecord);
  
        const filteredSubItem = Object.fromEntries(
          Object.entries(newRecord).filter(([_, value]) => {
            return value !== '' && value !== 0 && value !== undefined && value !== null;
          })
        );
        console.log(filteredSubItem);
  
        const { executionOrderMainCode, total, ...mainItemWithoutMainItemCode } = mainItem;
        const updatedRecord: MainItem = {
          ...mainItemWithoutMainItemCode, // Copy all properties from the original record
          executionOrdersubList: [
            ...(mainItem?.executionOrdersubList ?? []).map(subItem =>
              this.removeProperties(subItem, ['executionOrderMainCode', 'executionOrderSubCode'])
            ),
            filteredSubItem
          ],
          executionOrderMainCode: 0,
          total: 0
        }
        console.log(updatedRecord.executionOrdersubList);
  
        // if (this.newMainItem.quantity === 0 || this.newMainItem.grossPrice === 0) {
        //   this.messageService.add({
        //     severity: 'error',
        //     summary: 'Error',
        //     detail: 'Quantity and GrossPrice are required',
        //     life: 3000
        //   });
        // }
        console.log(updatedRecord);
        // Remove properties with empty or default values
        const filteredRecord = Object.fromEntries(
          Object.entries(updatedRecord).filter(([_, value]) => {
            return value !== '' && value !== 0 && value !== undefined && value !== null;
          })
        );
        console.log(filteredRecord);
  
        this._ApiService.patch<MainItem>('executionordermain',mainItem.executionOrderMainCode, filteredRecord).subscribe({
          next: (res) => {
            console.log('executionordermain Updated && subItem Created:', res);
            this.ngOnInit()
          }, error: (err) => {
            console.log(err);
          },
          complete: () => {
            this.resetNewSubItem();
            this.selectedUnitOfMeasure = "";
            this.selectedCurrency = "";
            this.selectedMaterialGroup = "";
            this.selectedServiceType = "";
            this.selectedLineType = "";
            this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Record added successfully ' });
            // this.ngOnInit()
          }
        });
      }
  
      else if (this.selectedServiceNumberRecord) { // if user select serviceNumber 
        const newRecord = {
          serviceNumberCode: this.selectedServiceNumber,
          unitOfMeasurementCode: this.selectedServiceNumberRecord?.baseUnitOfMeasurement,
          currencyCode: this.selectedCurrency,
          description: this.selectedServiceNumberRecord?.description,
  
          materialGroupCode: this.selectedServiceNumberRecord?.materialGroupCode,
          serviceTypeCode: this.selectedServiceNumberRecord?.serviceTypeCode,
          personnelNumberCode: this.newSubItem.personnelNumberCode,
          lineTypeCode: this.selectedLineType,
  
          totalQuantity: this.newSubItem.totalQuantity,
          amountPerUnit: this.newSubItem.amountPerUnit,
          //total: this.newSubItem.total,
  
          externalServiceNumber: this.newSubItem.externalServiceNumber,
          serviceText: this.newSubItem.serviceText,
          lineText: this.newSubItem.lineText,
          lineNumber: this.newSubItem.lineNumber,
  
          biddersLine: this.newSubItem.biddersLine,
          supplementaryLine: this.newSubItem.supplementaryLine,
          lotCostOne: this.newSubItem.lotCostOne,
          doNotPrint: this.newSubItem.doNotPrint,
        }
        console.log(newRecord);
        const filteredSubItem = Object.fromEntries(
          Object.entries(newRecord).filter(([_, value]) => {
            return value !== '' && value !== 0 && value !== undefined && value !== null;
          })
        );
        console.log(filteredSubItem);
        const { executionOrderMainCode, total, ...mainItemWithoutMainItemCode } = mainItem;
        const updatedRecord: MainItem = {
          ...mainItemWithoutMainItemCode, // Copy all properties from the original record
          executionOrdersubList: [
            ...(mainItem?.executionOrdersubList ?? []).map(subItem =>
              this.removeProperties(subItem, ['executionOrderMainCode', 'executionOrderSubCode'])
            ),
            filteredSubItem
          ],
          executionOrderMainCode: 0,
          total: 0
        }
        console.log(updatedRecord.executionOrdersubList);
        console.log(updatedRecord);
        // if ( this.resultAfterTest === 0 || this.newMainItem.grossPrice === 0) {
        //   this.messageService.add({
        //     severity: 'error',
        //     summary: 'Error',
        //     detail: 'Quantity and GrossPrice are required',
        //     life: 3000
        //   });
        // }
        // Remove properties with empty or default values
        const filteredRecord = Object.fromEntries(
          Object.entries(updatedRecord).filter(([_, value]) => {
            return value !== '' && value !== 0 && value !== undefined && value !== null;
          })
        );
        console.log(filteredRecord);
  
        this._ApiService.patch<MainItem>('executionordermain',mainItem.executionOrderMainCode, filteredRecord).subscribe({
          next: (res) => {
            console.log('executionordermain Updated && subItem Created:', res);
            this.ngOnInit()
          }, error: (err) => {
            console.log(err);
          },
          complete: () => {
            this.resetNewSubItem();
            this.selectedServiceNumberRecord = undefined;
            // this.selectedServiceNumber = 0;
            this.selectedLineType = "";
            this.selectedCurrency = ""
            this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Record added successfully ' });
            //this.ngOnInit()
          }
        });
      }
    }
  
    resetNewSubItem() {
      this.newSubItem = {
        executionOrderSubCode: 0,
        serviceNumberCode: 0,
        description: "",
        unitOfMeasurementCode: "",
        currencyCode: "",
        materialGroupCode: "",
        serviceTypeCode: "",
        personnelNumberCode: "",
        lineTypeCode: "",
  
        totalQuantity: 0,
        amountPerUnit: 0,
        total: 0,
  
        externalServiceNumber: "",
        serviceText: "",
        lineText: "",
        lineNumber: "",
  
        biddersLine: false,
        supplementaryLine: false,
        lotCostOne: false,
        doNotPrint: false,
        Type:''
      },
        this.selectedUnitOfMeasure = '';
    }
  
    //Export  to Excel Sheet
    exportExcel() {
  
      import('xlsx').then((xlsx) => {
        const selectedRows = this.mainItemsRecords;
        const worksheet = xlsx.utils.json_to_sheet(selectedRows);
        const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
        const excelBuffer: any = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });
        this.saveAsExcelFile(excelBuffer, 'Execution Order');
      });
    }
    saveAsExcelFile(buffer: any, fileName: string): void {
      let EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
      let EXCEL_EXTENSION = '.xlsx';
      const data: Blob = new Blob([buffer], {
        type: EXCEL_TYPE
      });
      FileSaver.saveAs(data, fileName + '_export_' + new Date().getTime() + EXCEL_EXTENSION);
    }
  
  }
